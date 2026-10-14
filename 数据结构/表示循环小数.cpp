/* PRESET CODE BEGIN - NEVER TOUCH CODE BELOW */

#include <stdio.h>
#include <stdlib.h>

typedef struct node
{   int         data;
    struct node * next;
} NODE;

void output( NODE *, int );
void change( int, int, NODE * );

void output( NODE * head, int kk )
{   int k=0;

	printf("0.");
	while ( head->next != NULL && k<kk )
	{   printf("%d", head->next->data );
		head = head->next;
		k ++;
	}
	printf("\n");
}

int main()
{   int n, m,k;
	NODE * head;

	scanf("%d%d%d", &n, &m, &k);
	head = (NODE *)malloc( sizeof(NODE) );
	head->next = NULL;
	head->data = -1;
	change( n, m, head );
	output( head,k );
	return 0;
}

/* PRESET CODE END - NEVER TOUCH CODE ABOVE */

int reachARepeatend (vector<vector<int>> pos) { 

}

void change( int n, int m, NODE * head) {
	// 首先进行长除法再逐位获取数字，这是个问题
	// 而后是循环节判定，判定完往里填入加设下一个节点就方便了

	vector<vector<int>> pos(10, vector<int>);
	int cur_pos=0; // 用于维护现有的小数位数和十个数每次出现的位置
	vector<int> decimal;

	while (!reachARepeatend(pos)) {
		n*=10;
		int digit=n/m;
		n%=m;
		decimal.push_back(digit);
		cur_pos++;
		pos[digit].push_back(cur_pos);
	}
}