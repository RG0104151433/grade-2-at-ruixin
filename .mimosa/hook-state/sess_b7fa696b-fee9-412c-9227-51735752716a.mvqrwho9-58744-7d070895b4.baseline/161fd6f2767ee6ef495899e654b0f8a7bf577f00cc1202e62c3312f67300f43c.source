//给你一个下标从 0 开始的二维整数数组 events ，其中 events[i] = [startTimei, endTimei, valuei] 。第 i 个活动开始于 startTimei ，结束于 endTimei ，如果你参加这个活动，那么你可以得到价值 valuei 。你 最多 可以参加 两个时间不重叠 活动，使得它们的价值之和 最大 。
//请你返回价值之和的 最大值 。
//注意，活动的开始时间和结束时间是 包括 在活动时间内的，也就是说，你不能参加两个活动且它们之一的开始时间等于另一个活动的结束时间。更具体的，如果你参加一个活动，且结束时间为 t ，那么下一个活动必须在 t + 1 或之后的时间开始。
class Solution {
public:
    int maxTwoEvents(vector<vector<int>>& events) {

        // ranges::sort 是 C++20 引入的排序算法，支持"投影"参数
        // 第一个参数：待排序容器；第二个参数：比较器，{} 表示使用默认的 < 运算符；第三个参数：投影函数，提取用于比较的"键"，这里取每个活动的 e[1]（结束时间）
        
        ranges::sort(events, {}, [](auto& e) { return e[1]; });

        // pair<int,int> 是标准库提供的"捆绑两个值"的结构体；访问方式：p.first 取第一个值，p.second 取第二个值
        // 若需捆绑三个及以上的值，使用 tuple<int,int,int>，用 get<0>(t) 等访问
        // 这里每个元素存 (结束时间, 截至该时间的历史最大价值)
        //
        // 该栈维护两个单调性（从栈底到栈顶）：
        //   - 结束时间严格递增（支持二分查找）
        //   - 价值严格递增（保证查到即最优，无需再扫描）
        // 哨兵 {0,0} 含义：结束时间为 0，价值为 0，代表"不选第一个活动"的基准情况，保证了后续 -1 操作不会越界，也覆盖了"只选一个活动"的情况
        
        vector<pair<int,int>> stk = {{0, 0}};
        int ans = 0;

        // auto& 中的 & 表示引用，直接操作原数据而非拷贝
        // 不加 & 写 auto cur 则每次循环都拷贝一份 vector<int>，有额外开销
        // 只读不写时更严格的写法是 const auto&
        
        for (auto& cur : events) {

            // ranges::lower_bound 在有序序列中找第一个 >= 目标值的位置
            // 返回值是迭代器，行为类似指针，指向找到的元素
            //
            // 四个参数含义：
            //   stk          : 在此容器中查找
            //   cur[0]       : 目标值，即当前活动的开始时间
            //   {}           : 比较器，使用默认 <
            //   &pair<int,int>::first : 投影（成员指针）
            //
            // &pair<int,int>::first 是"成员指针"语法
            // 作用：告诉算法比较时只取每个 pair 的 .first（结束时间）
            // 这里的 & 不是取地址，而是取"成员指针"，把"访问某成员"这个动作作为参数
            //
            // lower_bound 返回第一个 >= cur[0] 的位置
            // -1 退一步，得到最后一个结束时间 < cur[0] 的元素
            // 由于栈内价值单调递增，该元素的 .second 就是最优的第一个活动价值
            
            auto one = ranges::lower_bound(stk, cur[0], {}, &pair<int,int>::first) - 1;

            // one 是迭代器（类似指针），访问其指向的对象成员必须用 ->
            // 不能用 . ，因为 . 只用于直接访问对象本身的成员
            // one->second 等价于 (*one).second（先解引用，再访问成员）
            // 当 one 指向哨兵 {0,0} 时，one->second = 0。即"不选第一个活动"，此时只统计当前一个活动的价值
            
            ans = max(ans, one->second + cur[2]);

            // 只有当前活动价值严格大于栈顶价值时才入栈
            // 否则它不可能成为最优的"第一个活动"，直接丢弃
            // 这一步维护了栈内价值的单调递增性
            //
            // emplace_back 是原地构造：直接将参数转发到容器内部构造对象
            // push_back 是先构造临时对象再拷贝/移动进去，多一步开销
            // 写法对比：
            //   stk.emplace_back(cur[1], cur[2]);    // 原地构造，推荐
            //   stk.push_back({cur[1], cur[2]});     // 构造临时 pair 再移入
            
            if (cur[2] > stk.back().second) stk.emplace_back(cur[1], cur[2]);
        }
        return ans;
    }
};
