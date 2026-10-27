#include<bits/stdc++.h>
using namespace std;

map<char, int> var_id; // map的键值对应
int var_cnt=0; // 记录变量数

int get_variable_id (char c) {
    if (var_id.find(c)==var_id.end()) var_id[c]=++var_cnt;
    return var_id(c); // 大哥，map是不是得学一学了
}

void commit_clause (vector<int>& cur_clause, set<vector<int>>& clause) {
    if (!cur_clause.empty()) return ;
    // 现在有很多变量的析取，如果依旧分散那么就不好处理
    sort(cur_clause.begin(), cur_clause.end());
    // 这行是大肥鱼写的，它说可以完成 排序+去重 有点神奇
    cur_clause.erase(unique(cur_clause.begin(),cur_clause.end()),cur_clause.end());
    
    // 如果是永真式，就不需要插入了，可满足性和这个无关了
    // 所以如何判断是否永真就需要一个函数了
    if (!is_tautology(cur_clause)) clause.insert(cur_clause); // 大哥，set是不是得学一学了
    cur_clause.clear(); // 及时处理掉
}

bool is_tautology (vector<int>& cur_clause) { // 大肥鱼说加个const，我觉得合理，但是我没想起来
    int len=cur_clause.size();
    for (int i=0;i<len;i++) {
        for (int j=i+1;j<len;j++) {
            if (cur_clause[i]==-cur_clause[j]) return true;
        }
    }
    return false;
}

int main () {
    string s;
    if (!(cin>>s)) return 0; // 如果没有输入就结束
    
    // 问题是使用哪种数据结构？
    // 不能以字符进行处理，需要转化为数字
    /* 需要什么？
     * 首先要去重，对于合取范式，将其中的简单析取式及其补消去
     * 而后需要根据字典序排序
     * 所以使用set
     */
    set<vector<int>> clause; // 一个语句为多个文字的析取，故可以忽略符号，直接以vector存储文字的数字编码
    vector<int> cur_clause;
    
    // 接下来处理输入
    
    // 可能的输入有 ！ & | — + （ ）
    // 不对，！ 怎么处理？ —— 用一个变量存储？
    bool is_neg=false;
    for (char c:s) {
        if (c==!) is_neg=true;
        else if (c==&) { // 此时一个clause已经处理完，如果clause空则不处理
            if (!clause.empty()) {
                // 先空着吧，等会再说
                // 写了commit函数，就用这个
                commit_clause(cur_clause, clause);
            }
        }
        else if (isalpha(c)) { // 发现字母，开始处理
            // 如果要进行处理，就要获取数字，用一个函数进行处理
            // 还需要一个用于处理变量的数据结构，最好是全局的，后续就以数字进行处理
            int id=get_variable_id(c);
            
            // 补豪！现在这里就需要一个东西来存储，会不会消耗空间太多？和AI问问看
            // 好的，找大肥鱼问了一下，确实似乎还是直接解析，即时写入比较好
            // 大肥鱼给出的方案和原本的相似，继续写
            // 不过大肥鱼提醒我最大的时间空间开销在后面的部分，我认为合理
            
            cur_clause.emplace_back(neg?-id:id);
            neg=false; // 及时处理掉
        }
    }
    // 一个问题：最后一个clause也需要处理，干脆写个函数处理，叫commit吧哈哈
    commit_clause(cur_clause, clause);
    
    // 接下来就要开始比较了
    while (true) { // 用while的好处就是可以一直进行，而不是预先定好循环数，在这里比for好
        // 现在的clause都在set里面，如何逐一比较呢？
        // 要嘛set变成个vector<vector>，要嘛set可以遍历
        /* 问了大肥鱼，它告诉我：
         * vector 连续内存，效率更高，且下标访问更直观
         * 好像set确实没什么优势哈，那就转换成vector了
         */

        // 还有个问题，对于while的每一轮操作都会将全部内容比较一遍，如果没有继续产生新的子句，就说明处理完了，就要退出
        // 另外，对于一个特定的i-j，如果进行了操作，后续的j就不应该继续操作了

        bool has_new_clause=false;
        vector<vector<int>> clause_converted(clause.begin(), clause.end());
        int n=clause_converted.size();
        for (int i=0;i<n;i++) {
            for (int j=i+1;j<n;j++) {
                bool resolved=false;
                for (int lit:clause_converted[i]) {
                    if (find(clause_converted[j].begin(), clause_converted[j].end(), -lit)!=clause_converted[j].end()) { // 这个迭代器还挺有意思，直接通过位置是否是end相当于判断有没有了

                        // 发现了可以消去的，直接新建一个录入就行了
                        vector<int> new_clause;
                        for (int k:clause_converted[i]) if (k!=lit) new_clause.emplace_back(k);
                        for (int k:clause_converted[j]) if (k!=-lit) new_clause.emplace_back(k);

                        // 而后需要排序去重，就用上面的
                        sort(new_clause.begin(), new_clause.end());
                        new_clause.erase(unique(new_clause.begin(), new_clause.end()), new_clause.end());

                        // 如果是空简单析取式就返回NO
                        if (new_clause.empty()) {
                            cout<<"NO"<<endl;
                            return 0;
                        }

                        // 如果不是永真式且没出现过才需要插入了
                        if (!is_tautology(new_clause) && clause.find(new_clause)==clause.end()) {
                            clause.insert(new_clause);
                            has_new_clause=true;
                        }
                        resolved=true;
                    }
                }
            }
            if (resolved) break;
        }
        if (!has_new_clause) break;
    }
    cout<<"YES"<<endl;
    return 0;
}

// 首先获取输入——如何拆解？
// 而后要开始比较：
/* 对于两个clause，全部遍历找出重复的
 * （排序之后能否优化？）不对，本来就排序过了
 * 将重复的删去，将合并后的单独放 —— 这个部分如何实现？像书上的S 012嘛？
 * 应该不用，加进去继续比较就行了
 */