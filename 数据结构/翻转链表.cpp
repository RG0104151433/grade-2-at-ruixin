/* PRESET CODE BEGIN - NEVER TOUCH CODE BELOW */

#include <iostream>
using namespace std;

typedef int ElemType;
typedef struct node
{   ElemType    data;
    struct node * next;
} NODE;
typedef NODE * LinkList;

void output( LinkList );
void change( int, int, NODE * );
LinkList createList( ElemType );
void inverse( LinkList ); 

LinkList createList( ElemType finish )	//finish：数据结束标记 
{
    ElemType x;
    NODE *newNode; 
    LinkList first = new NODE;   // 建立头结点
    first->next = NULL;
    first->data = finish;
    cin >> x;	      			// 约定以finish结束连续输入
    while ( x != finish )
	{
        newNode = new NODE;      // 建立新结点
       	newNode->data = x;
       	newNode->next = first->next; // ①
      	first->next = newNode;       // ②
		cin >> x;
    }
    return first;
}

void output( LinkList head )
{   cout << "List:";
	while ( head->next != NULL )
	{   cout << head->next->data << ",";
		head = head->next;
	}
	cout << endl;
}

int main(int argc, char** argv) 
{
	LinkList head;

	head = createList( -1 );
	output( head );
	inverse( head );
	output( head );
	return 0;
}

/* PRESET CODE END - NEVER TOUCH CODE ABOVE */

void inverse( LinkList head) {
	// 应该得先排除空的情况，但是头节点和头节点的next是空的，应该怎么操作？
	// 大肥鱼说直接用head，很合理
	if (head==NULL || head->next==NULL) return ;

	// 接下来其实可以“原地”更改，应该不用重新新建节点的

	/*
	Node *cur=head;
	Node *next=head->next;
	 */
	// 以上应该不太合适，首先，对于每一次操作，记录当下的next，所以next不适合在这里设置
	// 另外，翻转时需要让后一个节点的next指向原链表中的前一个，这里需要记录

    /*
	NODE *pre=head;  之前的错误写法
	 */
	NODE *pre=NULL;
	NODE *cur=head->next;
	while (cur!=NULL) { // 在cur没有操作到最后一个的“下一个”之前都要继续
		NODE *next=cur->next;
		cur->next=pre;

		pre=cur;
		cur=next;
	}

	// 头节点也要修改
	head->next=pre;
}